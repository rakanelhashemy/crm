import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dashboardser } from '../../../core/models/dashboardser';
import { DealStageCount, KpiData, LabeledCount, LEAD_STAGE_COLORS, LEAD_STAGE_ORDER, RevenuePoint, TopAgent } from './dashboardinterface';

interface ChartPoint { x: number; y: number; }
interface DonutSegment { label: string; count: number; color: string; dashArray: string; dashOffset: number; }

@Component({
  selector: 'component-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private dashboardService = inject(Dashboardser);

  agentId = signal<string | undefined>(undefined);
  topAgentsCount = signal(5);

  private kpis$ = toSignal<KpiData | null>(this.dashboardService.getKpis(), { initialValue: null });

  // Fetch a wide range once; pagination below just slices this client-side
  // (the API's `months` param only controls how far back it starts — it
  // always ends at the current month, so there's no server-side "page").
  private allRevenue$ = toSignal(this.dashboardService.getRevenueByMonth(24), {
    initialValue: [] as RevenuePoint[],
  });
  allRevenuePoints = computed(() => this.allRevenue$());

  private leadsByStage$ = toSignal(this.dashboardService.getLeadsByStage(), { initialValue: [] as LabeledCount[] });
  private dealsByStage$ = toSignal(this.dashboardService.getDealsByStage(), { initialValue: [] as DealStageCount[] });
  private topAgents$ = toSignal(this.dashboardService.getTopAgents(this.topAgentsCount()), { initialValue: [] as TopAgent[] });

  kpis = this.kpis$;
  topAgents = this.topAgents$;

  // --- Revenue trend pagination (client-side windowing) ----------------
  readonly windowSize = 6;
  pageOffset = signal(0); // 0 = most recent 6 months

  revenuePoints = computed(() => {
    const all = this.allRevenuePoints();
    if (all.length === 0) return [];
    const offset = this.pageOffset();
    const end = all.length - offset * this.windowSize;
    const start = Math.max(0, end - this.windowSize);
    return all.slice(start, end);
  });

  canGoOlder = computed(() => {
    const offset = this.pageOffset();
    return (offset + 1) * this.windowSize < this.allRevenuePoints().length;
  });
  canGoNewer = computed(() => this.pageOffset() > 0);

  goOlder(): void {
    if (this.canGoOlder()) this.pageOffset.update(o => o + 1);
  }
  goNewer(): void {
    if (this.canGoNewer()) this.pageOffset.update(o => o - 1);
  }

  pagerLabel = computed(() => {
    const points = this.revenuePoints();
    if (points.length === 0) return '';
    return points.length === 1 ? points[0].month : `${points[0].month} – ${points[points.length - 1].month}`;
  });

  leadsByStage = computed(() =>
    // Reorder to the fixed stage order so the donut/legend are stable,
    // and fall back to whatever the API returned for unknown labels.
    [...(this.leadsByStage$() ?? [])].sort(
      (a, b) => LEAD_STAGE_ORDER.indexOf(a.label as any) - LEAD_STAGE_ORDER.indexOf(b.label as any)
    )
  );
  dealsByStage = computed(() =>
    [...(this.dealsByStage$() ?? [])].sort(
      (a, b) => LEAD_STAGE_ORDER.indexOf(a.stage as any) - LEAD_STAGE_ORDER.indexOf(b.stage as any)
    )
  );

  // --- KPI cards -------------------------------------------------------
  // Note: the API's /Dashboard/Kpis endpoint only returns current totals,
  // not a prior-period comparison, so there's no "vs last month" delta to
  // show here unless a second call (e.g. for the previous period) is added.
  kpiCards = computed(() => {
    const k = this.kpis();
    if (!k) return [];
    return [
      { label: 'Total Revenue', value: this.formatCurrency(k.totalRevenue), accent: 'var(--gold-100)' },
      { label: 'Active Deals', value: String(k.activeDeals), accent: 'var(--info-100)' },
      { label: 'Open Leads', value: String(k.openLeads), accent: 'var(--warn-100)' },
      { label: 'Win Rate', value: `${k.winRatePct}%`, accent: 'var(--success-100)' },
      { label: 'Converted Leads', value: String(k.convertedLeads), accent: '#EDE3FA' },
      { label: 'Total Customers', value: String(k.totalCustomers), accent: 'var(--success-100)' },
      { label: 'Available Properties', value: String(k.availableProperties), accent: 'var(--gold-100)' },
    ];
  });

  // --- Revenue trend chart geometry -----------------------------------
  private chartW = 640;
  private chartH = 260;
  private padL = 46;
  private padR = 20;
  private padT = 20;
  private padB = 34;

  revenueChart = computed(() => {
    const points = this.revenuePoints();
    if (points.length === 0) return null;

    const values = points.map(p => p.value);
    const max = Math.max(...values, 1);
    const plotW = this.chartW - this.padL - this.padR;
    const plotH = this.chartH - this.padT - this.padB;

    const coords: ChartPoint[] = points.map((p, i) => ({
      x: this.padL + (points.length === 1 ? 0 : (i * plotW) / (points.length - 1)),
      y: this.padT + plotH - (p.value / max) * plotH,
    }));

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${this.chartH - this.padB} L${coords[0].x.toFixed(1)},${this.chartH - this.padB} Z`;

    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const y = this.padT + (plotH * i) / 4;
      const value = max - (max * i) / 4;
      return { y, label: this.formatCurrency(value, true) };
    });

    return {
      width: this.chartW,
      height: this.chartH,
      linePath,
      areaPath,
      points: coords.map((c, i) => ({ ...c, month: points[i].month })),
      gridLines,
    };
  });

  // --- Lead status donut ------------------------------------------------
  donutSegments = computed<DonutSegment[]>(() => {
    const stages = this.leadsByStage();
    const total = stages.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 70; // r = 70
    let offset = 0;
    return stages.map(s => {
      const length = (s.count / total) * circumference;
      const seg: DonutSegment = {
        label: s.label,
        count: s.count,
        color: LEAD_STAGE_COLORS[s.label] ?? 'var(--text-tertiary)',
        dashArray: `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`,
        dashOffset: -offset,
      };
      offset += length;
      return seg;
    });
  });

  totalLeads = computed(() => this.leadsByStage().reduce((sum, s) => sum + s.count, 0));

  // --- Pipeline mini bars -------------------------------------------------
  pipelineBars = computed(() => {
    const stages = this.dealsByStage();
    const max = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({
      stage: s.stage,
      count: s.count,
      heightPct: (s.count / max) * 100,
      color: LEAD_STAGE_COLORS[s.stage] ?? 'var(--text-tertiary)',
    }));
  });

  activeDealsTotal = computed(() => this.pipelineBars().reduce((sum, b) => sum + b.count, 0));

  // --- Top agents ----------------------------------------------------
  topAgentsRows = computed(() => {
    const agents = this.topAgents() ?? [];
    const max = Math.max(...agents.map(a => a.revenue), 1);
    return agents.map((a, i) => ({
      rank: i + 1,
      initials: this.initials(a.agentName),
      name: a.agentName,
      widthPct: (a.revenue / max) * 100,
      dealsWon: a.dealsWon,
      totalLeads: a.totalLeads,
      revenue: this.formatCurrency(a.revenue),
    }));
  });

  // --- helpers ---------------------------------------------------------
  private formatCurrency(value: number, short = false): string {
    if (short) {
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
      if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
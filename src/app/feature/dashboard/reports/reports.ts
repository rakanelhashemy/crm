import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dashboardser } from '../../../core/models/dashboardser';
import { LabeledCount, RevenuePoint, PropertyTypeRevenue, PropertyStatusCount, AgentPerformance } from '../dashboard/dashboardinterface';
import { CommonModule } from '@angular/common';


type ReportTab = 'leads' | 'revenue' | 'properties' | 'performance';
 
interface BarChartBar {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  valueLabel: string;
}
interface BarChart {
  width: number;
  height: number;
  baselineY: number;
  bars: BarChartBar[];
}
interface DonutSegment {
  label: string;
  value: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}
 
// لوحة ألوان عامة بتتلف على العناصر لو مفيش label ثابت معروف مسبقًا
// (زي أنواع العقارات أو حالاتها اللي بتيجي ديناميك من الـ API).
const CHART_PALETTE = [
  'var(--gold-500)',
  'var(--info-600)',
  'var(--success-600)',
  'var(--warn-600)',
  '#7A4FC4',
  '#C8722E',
  '#2E8FC8',
];
@Component({
  selector: 'component-reports',
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports { private dashboardService = inject(Dashboardser);
 
  // --- Tabs -------------------------------------------------------------
  activeTab = signal<ReportTab>('revenue'); // نفس التبويب الافتراضي في الموك
 
  setTab(tab: ReportTab): void {
    this.activeTab.set(tab);
  }
 
  // =======================================================================
  // LEADS REPORT — Leads by Source
  // =======================================================================
  private leadsBySource$ = toSignal(this.dashboardService.getLeadsBySource(), {
    initialValue: [] as LabeledCount[],
  });
 
  leadsSourceChart = computed<BarChart | null>(() => {
    const data = this.leadsBySource$();
    if (data.length === 0) return null;
    return this.buildBarChart(
      data.map(d => ({ label: d.label, value: d.count })),
      v => String(v)
    );
  });
 
  // =======================================================================
  // REVENUE REPORT — Monthly Revenue (bar, paginated) + Revenue by Property Type
  // =======================================================================
  private allRevenue$ = toSignal(this.dashboardService.getRevenueByMonth(24), {
    initialValue: [] as RevenuePoint[],
  });
  private allRevenuePoints = computed(() => this.allRevenue$());
 
  readonly revenueWindowSize = 6;
  revenuePageOffset = signal(0);
 
  revenuePoints = computed(() => {
    const all = this.allRevenuePoints();
    if (all.length === 0) return [];
    const offset = this.revenuePageOffset();
    const end = all.length - offset * this.revenueWindowSize;
    const start = Math.max(0, end - this.revenueWindowSize);
    return all.slice(start, end);
  });
 
  canGoOlderRevenue = computed(() => {
    const offset = this.revenuePageOffset();
    return (offset + 1) * this.revenueWindowSize < this.allRevenuePoints().length;
  });
  canGoNewerRevenue = computed(() => this.revenuePageOffset() > 0);
 
  goOlderRevenue(): void {
    if (this.canGoOlderRevenue()) this.revenuePageOffset.update(o => o + 1);
  }
  goNewerRevenue(): void {
    if (this.canGoNewerRevenue()) this.revenuePageOffset.update(o => o - 1);
  }
 
  revenuePagerLabel = computed(() => {
    const points = this.revenuePoints();
    if (points.length === 0) return '';
    return points.length === 1 ? points[0].month : `${points[0].month} – ${points[points.length - 1].month}`;
  });
 
  revenueBarChart = computed<BarChart | null>(() => {
    const points = this.revenuePoints();
    if (points.length === 0) return null;
    return this.buildBarChart(
      points.map(p => ({ label: p.month, value: p.value })),
      v => this.formatCurrency(v, true),
      'var(--gold-500)'
    );
  });
 
  private revenueByPropertyType$ = toSignal(this.dashboardService.getRevenueByPropertyType(), {
    initialValue: [] as PropertyTypeRevenue[],
  });
 
  revenueTypeDonut = computed<DonutSegment[]>(() =>
    this.buildDonut(this.revenueByPropertyType$().map(d => ({ label: d.propertyType, value: d.revenue })))
  );
 
  revenueTypeTotal = computed(() =>
    this.revenueByPropertyType$().reduce((sum, d) => sum + d.revenue, 0)
  );
  revenueTypeTotalLabel = computed(() => this.formatCurrency(this.revenueTypeTotal(), true));
 
  revenueTypeLegend = computed(() =>
    this.revenueByPropertyType$().map((d, i) => ({
      label: d.propertyType,
      valueLabel: this.formatCurrency(d.revenue, true),
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
  );
 
  // =======================================================================
  // PROPERTIES REPORT — Properties by Status (+ Inventory Value: not wired yet)
  // =======================================================================
  private propertiesByStatus$ = toSignal(this.dashboardService.getPropertiesByStatus(), {
    initialValue: [] as PropertyStatusCount[],
  });
 
  propertiesStatusDonut = computed<DonutSegment[]>(() =>
    this.buildDonut(this.propertiesByStatus$().map(d => ({ label: d.status, value: d.count })))
  );
 
  propertiesTotal = computed(() => this.propertiesByStatus$().reduce((sum, d) => sum + d.count, 0));
 
  propertiesStatusLegend = computed(() =>
    this.propertiesByStatus$().map((d, i) => ({
      label: d.status,
      valueLabel: String(d.count),
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
  );


 
  // =======================================================================
  // SALES PERFORMANCE — table
  // =======================================================================
  private agentsPerformance$ = toSignal(this.dashboardService.getAgentsPerformance(), {
    initialValue: [] as AgentPerformance[],
  });
 
  performanceRows = computed(() =>
    this.agentsPerformance$().map(a => ({
      initials: this.initials(a.agentName),
      name: a.agentName,
      totalLeads: a.totalLeads,
      dealsWon: a.dealsWon,
      revenue: this.formatCurrency(a.revenue),
      winRatePct: `${a.winRatePct}%`,
      avgDealValue: this.formatCurrency(a.avgDealValue),
    }))
  );
 
  // --- Chart builders ----------------------------------------------------
  private buildBarChart(
    data: { label: string; value: number }[],
    formatValue: (v: number) => string,
    color = 'var(--info-600)'
  ): BarChart {
    const width = 640;
    const height = 260;
    const padL = 40;
    const padR = 20;
    const baselineY = 220;
    const topPad = 40; // مساحة فوق أعلى عمود عشان الـ value label ميتقصّش
 
    const values = data.map(d => d.value);
    const max = Math.max(...values, 1);
    const plotW = width - padL - padR;
    const slotW = plotW / data.length;
    const barW = slotW * 0.6;
    const scale = (baselineY - topPad) / max;
 
    const bars: BarChartBar[] = data.map((d, i) => {
      const barH = d.value * scale;
      const x = padL + i * slotW + (slotW - barW) / 2;
      const y = baselineY - barH;
      return {
        x,
        y,
        width: barW,
        height: barH,
        label: d.label,
        valueLabel: formatValue(d.value),
      };
    });
 
    return { width, height, baselineY, bars };
  }
 
  private buildDonut(data: { label: string; value: number }[]): DonutSegment[] {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return [];
 
    const circumference = 2 * Math.PI * 70; // r = 70
    let offset = 0;
    return data.map((d, i) => {
      const length = (d.value / total) * circumference;
      const seg: DonutSegment = {
        label: d.label,
        value: d.value,
        color: CHART_PALETTE[i % CHART_PALETTE.length],
        dashArray: `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`,
        dashOffset: -offset,
      };
      offset += length;
      return seg;
    });
  }
 
  // --- helpers -------------------------------------------------------
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
  }}

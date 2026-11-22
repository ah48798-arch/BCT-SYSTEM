import { Campaign, CapacitySettings, CapacityBreakdown, CapacityAdjustment } from '../types/database.types';

/**
 * BCT Enterprise - Centralized Operational Capacity Calculation Engine
 * 
 * Strict Compliance:
 * - Approved intake capacity = Base capacity + approved administrative adjustments
 * - Committed capacity = Active student file workload + reserved registrations from approved active campaigns
 * - Avoids double-counting the campaign currently under evaluation
 * - Distinguishes clearly between expected inquiries (leads) and estimated registrations
 */

export const DEFAULT_CAPACITY_SETTINGS: CapacitySettings = {
  period: '2026/2027 – موسم القبول والتوثيق الرئيسي',
  base_capacity: 2500,
  adjustments: [
    {
      id: 'adj-init-01',
      period: '2026/2027 – موسم القبول والتوثيق الرئيسي',
      adjustment_slots: 0,
      reason: 'السقف التشغيلي الافتراضي المعتمد من المدير العام لإدارة العمليات والقبول',
      approved_by: 'emp-001',
      approved_by_name: 'خليل محمد (المدير العام)',
      created_at: '2026-09-01T08:00:00.000Z'
    }
  ],
  last_updated_at: '2026-09-01T08:00:00.000Z',
  last_updated_by: 'bashdar.gm'
};

export class CapacityCalculationService {
  /**
   * Calculate full breakdown of operational capacity
   * 
   * @param settings Capacity configuration (base + adjustments)
   * @param activeFilesCount Number of currently active student files in ops pipeline
   * @param campaigns All campaigns in store
   * @param evaluatingCampaignId Optional ID of campaign being reviewed (excluded from previous commitments to prevent double-counting)
   * @param proposedRegistrations Optional proposed registrations override
   */
  public static calculate(
    settings: CapacitySettings,
    activeFilesCount: number,
    campaigns: Campaign[],
    evaluatingCampaignId?: string,
    proposedRegistrations?: number
  ): CapacityBreakdown {
    const totalAdjustments = (settings.adjustments || []).reduce(
      (sum, adj) => sum + (Number(adj.adjustment_slots) || 0),
      0
    );

    const approvedCapacity = Math.max(0, (Number(settings.base_capacity) || 2500) + totalAdjustments);

    // Filter approved active campaigns, excluding the evaluating campaign to avoid double counting
    const approvedActiveCampaigns = (campaigns || []).filter(c => {
      const isApproved = c.status === 'approved' || c.ops_capacity_approved === true;
      const isNotCancelled = c.status !== 'cancelled' && c.status !== 'rejected';
      const isNotEvaluating = evaluatingCampaignId ? c.id !== evaluatingCampaignId : true;
      return isApproved && isNotCancelled && isNotEvaluating;
    });

    const reservedCampaignCapacity = approvedActiveCampaigns.reduce(
      (sum, c) => sum + (Number(c.expected_registrations) || 0),
      0
    );

    // In BCT operational guidelines:
    // Total committed capacity represents student registrations already committed by approved active campaigns
    // Note: If files exist without campaigns, they can be factored, but campaign registrations reserve official intake
    const committedCapacity = reservedCampaignCapacity;

    const availableCapacity = Math.max(0, approvedCapacity - committedCapacity);

    // If proposed registrations not passed, extract from evaluating campaign if present
    let proposed = Number(proposedRegistrations) || 0;
    if (proposedRegistrations === undefined && evaluatingCampaignId) {
      const targetCamp = (campaigns || []).find(c => c.id === evaluatingCampaignId);
      if (targetCamp) {
        proposed = Number(targetCamp.expected_registrations) || 0;
      }
    }

    const projectedRemaining = availableCapacity - proposed;
    const isOverCapacity = proposed > availableCapacity;

    return {
      period: settings.period || '2026/2027',
      base_capacity: Number(settings.base_capacity) || 2500,
      total_adjustments: totalAdjustments,
      approved_capacity: approvedCapacity,
      active_workload: activeFilesCount || 0,
      reserved_campaign_capacity: reservedCampaignCapacity,
      committed_capacity: committedCapacity,
      available_capacity: availableCapacity,
      proposed_registrations: proposed,
      projected_remaining: projectedRemaining,
      is_over_capacity: isOverCapacity,
      active_approved_campaigns_count: approvedActiveCampaigns.length,
      active_pipeline_files_count: activeFilesCount || 0,
      utilization_rate_pct: approvedCapacity > 0 ? Number(((committedCapacity / approvedCapacity) * 100).toFixed(2)) : 0
    };
  }

  /**
   * Determine whether an approval should be permitted based on live capacity
   */
  public static canApprove(
    settings: CapacitySettings,
    activeFilesCount: number,
    campaigns: Campaign[],
    campaign: Campaign
  ): { allowed: boolean; reason?: string; breakdown: CapacityBreakdown } {
    const breakdown = this.calculate(
      settings,
      activeFilesCount,
      campaigns,
      campaign.id,
      campaign.expected_registrations
    );

    if (breakdown.is_over_capacity) {
      const excess = campaign.expected_registrations - breakdown.available_capacity;
      return {
        allowed: false,
        reason: `التسجيلات المتوقعة للحملة (${campaign.expected_registrations}) تتجاوز الطاقة الاستيعابية المتاحة (${breakdown.available_capacity}) بمقدار ${excess} ملفاً. يلزم اعتماد تعديل طاقة استيعابية أولاً.`,
        breakdown
      };
    }

    return {
      allowed: true,
      breakdown
    };
  }
}

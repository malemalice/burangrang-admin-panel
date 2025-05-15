-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mThreatId_fkey" FOREIGN KEY ("mThreatId") REFERENCES "m_threats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_risk_assessment_item" ADD CONSTRAINT "t_risk_assessment_item_mHseCategoryId_fkey" FOREIGN KEY ("mHseCategoryId") REFERENCES "m_hse_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

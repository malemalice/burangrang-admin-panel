-- CreateIndex
CREATE INDEX "m_areas_code_idx" ON "m_areas"("code");

-- CreateIndex
CREATE INDEX "m_audit_clause_code_idx" ON "m_audit_clause"("code");

-- CreateIndex
CREATE INDEX "m_audit_criteria_code_idx" ON "m_audit_criteria"("code");

-- CreateIndex
CREATE INDEX "m_audit_element_code_idx" ON "m_audit_element"("code");

-- CreateIndex
CREATE INDEX "m_companies_code_idx" ON "m_companies"("code");

-- CreateIndex
CREATE INDEX "m_departments_code_idx" ON "m_departments"("code");

-- CreateIndex
CREATE INDEX "m_email_templates_code_idx" ON "m_email_templates"("code");

-- CreateIndex
CREATE INDEX "m_heavy_equipment_code_idx" ON "m_heavy_equipment"("code");

-- CreateIndex
CREATE INDEX "m_job_positions_code_idx" ON "m_job_positions"("code");

-- CreateIndex
CREATE INDEX "m_machines_code_idx" ON "m_machines"("code");

-- CreateIndex
CREATE INDEX "m_materials_code_idx" ON "m_materials"("code");

-- CreateIndex
CREATE INDEX "m_offices_code_idx" ON "m_offices"("code");

-- CreateIndex
CREATE INDEX "m_permissions_name_idx" ON "m_permissions"("name");

-- CreateIndex
CREATE INDEX "m_professions_code_idx" ON "m_professions"("code");

-- CreateIndex
CREATE INDEX "m_risk_code_idx" ON "m_risk"("code");

-- CreateIndex
CREATE INDEX "m_risk_categories_code_idx" ON "m_risk_categories"("code");

-- CreateIndex
CREATE INDEX "m_roles_name_idx" ON "m_roles"("name");

-- CreateIndex
CREATE INDEX "m_roles_code_idx" ON "m_roles"("code");

-- CreateIndex
CREATE INDEX "m_rooms_code_idx" ON "m_rooms"("code");

-- CreateIndex
CREATE INDEX "m_rooms_areaId_idx" ON "m_rooms"("areaId");

-- CreateIndex
CREATE INDEX "m_settings_key_idx" ON "m_settings"("key");

-- CreateIndex
CREATE INDEX "m_tools_code_idx" ON "m_tools"("code");

-- CreateIndex
CREATE INDEX "m_work_classification_code_idx" ON "m_work_classification"("code");

-- CreateIndex
CREATE INDEX "t_courses_slug_idx" ON "t_courses"("slug");

-- CreateIndex
CREATE INDEX "t_users_email_idx" ON "t_users"("email");

-- CreateIndex
CREATE INDEX "t_work_permits_code_idx" ON "t_work_permits"("code");

-- Type of Work master seeds
INSERT INTO m_work_classification (code, name, description) VALUES
('HOT_WORK', 'Hot Work', 'Welding, cutting, grinding, uses open flame or heat.'),
('ELECTRICITY', 'Electricity', 'Electrical wiring, repair, live electrical works.'),
('HEIGHT', 'Working at Height', 'Work above 2 meters, scaffolding, ladders.'),
('HEAVY_EQUIPMENT', 'Heavy Equipment', 'Use of heavy machinery and vehicles.'),
('PLUMBING', 'Plumbing', 'Piping, plumbing, tanks and storage works.'),
('TANK_STORAGE', 'Tank / Storage', 'Work involving storage tanks and vessels.'),
('CONFINED_SPACE', 'Confined Space', 'Work inside tanks, silos, pits, vaults.'),
('DIGGING', 'Digging / Excavation', 'Ground works, excavation, trenches.'),
('NEIGHBORS_IMPACT', 'Affects Neighbors', 'Work that impacts surrounding residential area.'),
('GENERAL', 'General Works', 'Daily maintenance, light construction, painting, etc.'),
('OTHERS', 'Others', 'Miscellaneous work types not listed.')

-- profession seed
INSERT INTO profession (name, description) VALUES
('Engineer','Site/Project engineer'),
('Surveyor','Area surveyor'),
('PIC_BSJ','PIC BSJ (on-site contact)'),
('HEAVY_EQUIPMENT_OPERATOR','Heavy equipment operator'),
('Rigger','Rigger'),
('ELECTRIC_TECH','Electric Technician'),
('Mechanic','Mechanic'),
('VENDOR_SUPERVISOR','Vendor Supervisor'),
('VENDOR_HSE','Vendor HSE Personnel'),
('BSJ_HSE_OFFICER','BSJ HSE Officer'),
('Civil_Worker','Civil worker'),
('Carpenter','Carpenter'),
('Welder','Welder'),
('Fitter','Fitter'),
('Helper','Helper'),
('Other','Other')

-- Safety Items (PPE) seed
INSERT INTO safety_items_master (code, name, category, description) VALUES
('HELMET','Safety Helmet','PPE','Standard construction hard hat / helmet'),
('EAR_PROTECTION','Ear Plug / Muff','PPE','Hearing protection for >85dB areas'),
('SAFETY_GLASSES','Safety Glasses','PPE','Impact-resistant eye protection'),
('WELDING_GOGGLES','Welding Goggles','PPE','UV protected goggles for welding'),
('FACE_SHIELD','Face Shield','PPE','Full face shield for grinding/welding'),
('SAFETY_VEST','Safety Vest','PPE','High-visibility vest'),
('SAFETY_BOOTS','Safety Boots','PPE','Steel toe safety boots'),
('FULL_BODY_HARNESS','Full Body Harness','PPE','Fall arrest harness'),
('RESPIRATOR','Respirator / Mask','PPE','For dust / chemical protection'),
('GLOVES_COTTON','Cotton Gloves','PPE','General-purpose gloves'),
('GLOVES_RUBBER','Rubber Gloves','PPE','For electrical/chemical safety'),
('GLOVES_WELD','Welding Gloves','PPE','Heat resistant welding gloves'),
('FIRE_EXTINGUISHER','Fire Extinguisher','Emergency','Portable fire extinguisher'),
('LOTO_SET','Lock Out Tag Out Set','Emergency','LOTO tools and tags')

-- Violations master seed
INSERT INTO violations_master (code, title, severity, description) VALUES
('NO_PERMIT','Work without permit','Serious','Work started/executed without a valid permit'),
('NO_PPE','No PPE / Missing required PPE','Moderate','Personnel not wearing required PPE'),
('NO_SUPERVISOR','No Supervisor on site','Moderate','Work performed without a designated supervisor'),
('NO_BARRICADE','No safe barricade','Serious','Unsafe or missing barricade at hazardous area'),
('NO_FIRE_EXT','No Fire Extinguisher for hot work','Serious','Hot work executed without APAR available'),
('POOR_HOUSEKEEPING','Poor housekeeping','Serious','Waste disposal and housekeeping inadequate'),
('REPEAT_SERIOUS','Repeat serious violations','Very Serious','Repeated major violations leading to contract termination'),
('BRING_WEAPON','Bring dangerous weapon','Serious','Bringing weapons onto site'),
('NO_LICENSE','Worker without required license','Serious','Worker operates without required license/cert')
;
-- Type of Work master seeds (from the Work Permit Form Package)
INSERT INTO m_work_classification (code, name, description, created_at) VALUES
('GENERAL_WORKS', 'GENERAL WORKS', 'General works: operations with potential hazard and daily maintenance (civil works, ground works, digging, plumbing, daily maintenance, use of materials like paint/concrete/PVC glue, light construction, etc).'),
('WORKING_AT_HEIGHT', 'WORKING AT HEIGHT', 'Working at height: operations above 2 meters including scaffolding, ladders, painting, gondola, AC maintenance and similar where fall risk exists.'),
('HOT_WORKS', 'HOT WORKS', 'Hot works: activities using open flames or generating heat/sparks (welding, flame cutting, soldering, brazing, grinding, tar boilers, etc).'),
('ELECTRICITY_WORKS', 'ELECTRICITY WORKS', 'Electricity works: electrical wiring, installation, maintenance and repair of electrical systems and stationary machines; includes live electrical hazard controls.'),
('CONFINED_SPACE_WORKS', 'CONFINED SPACE WORKS', 'Confined space works: entry into limited/restricted spaces not designed for continuous occupancy (vessels, silos, storage bins, hoppers, vaults, pits, manholes, tunnels, ductwork, pipelines, etc).'),
('HEAVY_EQUIPMENT_WORK', 'HEAVY EQUIPMENT WORK', 'Heavy equipment work: use and operation of heavy-duty vehicles and machines for construction/earthworks; only certified operators allowed.'),
('NEIGHBORS_IMPACT_WORKS', 'WORK THAT IMPACTS THE SURROUNDING RESIDENTIAL ENVIRONMENT', 'Works that impact surrounding residential areas (noise, vibration, air/water pollution, traffic disruption). Approval from Government & Community Relations Senior Manager required when selected.'),
('OTHERS', 'OTHERS', 'Other / Miscellaneous work types not listed above.');

-- Optional: verify rows inserted
SELECT id, code, name FROM m_work_classification ORDER BY id;

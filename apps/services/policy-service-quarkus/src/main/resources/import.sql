-- Policy Types
INSERT INTO policy_type (id, code, description) VALUES (1, 'TRAVEL', 'Travel insurance products covering trips and cancellations');
INSERT INTO policy_type (id, code, description) VALUES (2, 'HEALTH', 'Health insurance products for individuals, families and seniors');

-- Travel Categories
INSERT INTO policy_category (id, name, policy_type_id) VALUES (1, 'Trip Protection', 1);
INSERT INTO policy_category (id, name, policy_type_id) VALUES (2, 'Trip Cancellation', 1);

-- Health Categories
INSERT INTO policy_category (id, name, policy_type_id) VALUES (3, 'Individual', 2);
INSERT INTO policy_category (id, name, policy_type_id) VALUES (4, 'Family', 2);
INSERT INTO policy_category (id, name, policy_type_id) VALUES (5, 'Senior Citizen', 2);

-- Health Policies (rich data)
INSERT INTO health_policy (id, name, description, sum_insured, monthly_premium, category_id) VALUES (1, 'Basic Health Plan', 'Covers hospitalization, doctor visits, medicines', 500000, 450, 3);
INSERT INTO health_policy (id, name, description, sum_insured, monthly_premium, category_id) VALUES (2, 'Comprehensive Health Plan', 'Full coverage with critical illness and maternity', 1500000, 950, 3);
INSERT INTO health_policy (id, name, description, sum_insured, monthly_premium, category_id) VALUES (3, 'Family Floater Plan', 'Covers entire family with shared sum insured', 2000000, 1450, 4);
INSERT INTO health_policy (id, name, description, sum_insured, monthly_premium, category_id) VALUES (4, 'Senior Citizen Plan', 'Age-appropriate cover with no age limit', 1000000, 1200, 5);

-- ... (previous inserts for types and categories) ...

-- Add addons for HEALTH categories
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (3, 'Dental Cover');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (3, 'Vision Cover');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (3, 'Critical Illness');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (3, 'Maternity');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (3, 'Personal Accident');

INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (4, 'Dental Cover');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (4, 'Vision Cover');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (4, 'Critical Illness');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (4, 'Maternity');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (4, 'Personal Accident');

INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (5, 'Dental Cover');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (5, 'Vision Cover');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (5, 'Critical Illness');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (5, 'Maternity');
INSERT INTO policy_category_addons (policy_category_id, addon) VALUES (5, 'Personal Accident');
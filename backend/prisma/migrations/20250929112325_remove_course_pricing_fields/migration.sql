-- RemoveCoursePricingFields
-- Remove price and salePrice fields from t_courses table as pricing is now handled through associated products

ALTER TABLE "t_courses" DROP COLUMN IF EXISTS "price";
ALTER TABLE "t_courses" DROP COLUMN IF EXISTS "salePrice";

DELETE op_duplicate
FROM owner_properties op_duplicate
JOIN owner_properties op_keep
  ON op_keep.owner_id = op_duplicate.owner_id
 AND op_keep.property_id = op_duplicate.property_id
 AND op_keep.id < op_duplicate.id;

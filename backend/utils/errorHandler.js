/**
 * Centralized MySQL Error & Validation Mapper for LIFE-LINK
 * Maps database-level constraint violations and errors to user-friendly HTTP responses.
 */

function handleMySQLError(err, res, defaultMessage = 'An unexpected database error occurred.') {
  console.error('[Database Error]:', err.code || err.name, err.message);

  // 1. Unique constraint violation (Duplicate key)
  if (err.code === 'ER_DUP_ENTRY') {
    let field = 'record';
    if (err.message.includes('phone')) field = 'Phone number';
    else if (err.message.includes('email')) field = 'Email address';
    else if (err.message.includes('license_number')) field = 'Hospital license number';
    else if (err.message.includes('uq_camp_donor')) field = 'Donor is already registered for this camp';
    else if (err.message.includes('uq_compatibility')) field = 'Blood compatibility combination already exists';
    else if (err.message.includes('person_id')) field = 'This person already has an associated specialization role';

    return res.status(409).json({
      success: false,
      message: `${field} is already registered in the system. Duplicate entries are disallowed.`,
      error_code: 'DUPLICATE_ENTRY',
    });
  }

  // 2. Foreign Key constraint failure (Referenced row does not exist)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    let entity = 'referenced entity';
    if (err.message.includes('hospital_id')) entity = 'Selected hospital does not exist.';
    else if (err.message.includes('ward_id')) entity = 'Selected ward does not exist.';
    else if (err.message.includes('person_id')) entity = 'Associated person record does not exist.';
    else if (err.message.includes('donor_id')) entity = 'Selected donor does not exist.';
    else if (err.message.includes('patient_id')) entity = 'Selected patient does not exist.';

    return res.status(400).json({
      success: false,
      message: `Invalid reference: ${entity}`,
      error_code: 'FOREIGN_KEY_VIOLATION',
    });
  }

  // 3. Foreign Key constraint failure (Deleting a row that is referenced by child tables)
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete or alter this record because active dependent medical records reference it.',
      error_code: 'REFERENTIAL_DEPENDENCY',
    });
  }

  // 4. CHECK Constraint Violated
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    let rule = 'Database constraint requirement not satisfied.';
    if (err.message.includes('chk_unit_expiry')) rule = 'Blood unit expiry date must be on or after the donation date.';
    else if (err.message.includes('chk_req_dates')) rule = 'Required-by date must be on or after the request date.';
    else if (err.message.includes('chk_camp_dates')) rule = 'Camp end date must be on or after the start date.';
    else if (err.message.includes('total_beds')) rule = 'Total bed capacity must be a positive integer greater than zero.';
    else if (err.message.includes('quantity_ml')) rule = 'Donation volume must be between 300 ml and 550 ml.';
    else if (err.message.includes('hemoglobin_level')) rule = 'Hemoglobin level must be at least 10.0 g/dL.';

    return res.status(400).json({
      success: false,
      message: `Constraint violation: ${rule}`,
      error_code: 'CHECK_CONSTRAINT_VIOLATION',
    });
  }

  // 5. Trigger raised custom error (SIGNAL SQLSTATE '45000')
  if (err.code === 'ER_SIGNAL_EXCEPTION' || err.sqlState === '45000') {
    return res.status(409).json({
      success: false,
      message: err.message,
      error_code: 'INTEGRITY_TRIGGER_VIOLATION',
    });
  }

  // 6. Generic Fallback
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

module.exports = {
  handleMySQLError,
};

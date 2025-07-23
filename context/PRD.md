
### In-Scope (MVP)
- **Core Functionality**:
  - JPEG/PNG/DICOM upload via web interface
  - Automated Cobb angle detection using Scoliosis_project models
  - Visual overlay showing detected vertebrae and measurement lines
  - Severity classification (mild/moderate/severe)
  - PDF report generation with institutional branding

### FR-001: Image Upload & Processing
- **FR-001.1**: Support drag-and-drop upload for JPEG, PNG (≤50MB), DICOM files
- **FR-001.3**: Validate image quality (resolution ≥1024px, AP view detection)
- **FR-001.4**: Provide upload progress indicators and error messaging
- **FR-001.5**: Support batch upload for up to 10 studies simultaneously

### FR-002: AI-Powered Cobb Angle Detection
- **FR-002.1**: Integrate mazurowski-lab Scoliosis_project model via containerized inference service
- **FR-002.2**: Detect end vertebrae automatically using trained MMDetection models
- **FR-002.3**: Calculate primary and secondary curve Cobb angles
- **FR-002.4**: Provide confidence scores for each measurement (0-100%)
- **FR-002.5**: Flag cases requiring manual review (confidence <80%)

### FR-003: Measurement Visualization
- **FR-003.1**: Display original X-ray with interactive measurement overlays
- **FR-003.2**: Show detected vertebrae boundaries and endplate lines
- **FR-003.3**: Allow manual adjustment of measurement points if needed
- **FR-003.4**: Provide side-by-side comparison with previous studies
- **FR-003.5**: Include measurement metadata (timestamp, model version, confidence)

### FR-004: Clinical Classification & Reporting
- **FR-004.1**: Classify severity: Normal (<10°), Mild (10-25°), Moderate (25-45°), Severe (>45°)
- **FR-004.2**: Generate PDF reports with institutional branding
- **FR-004.3**: Include measurement methodology and model attribution
- **FR-004.4**: Export FHIR R4 DiagnosticReport with structured data
- **FR-004.5**: Support custom report templates per institution and doctors office.

### FR-005: Data Management & Audit
- **FR-005.1**: Maintain versioned measurement history per patient
- **FR-005.2**: Log all user actions with timestamps and user identification
- **FR-005.3**: Store encrypted images with configurable retention periods
- **FR-005.4**: Provide data export capabilities (CSV, JSON, FHIR)
- **FR-005.5**: Support data purging for patient withdrawal/deletion requests

### FR-006: User Authentication & Authorization
- **FR-006.1**: Use ClerkJS for rapid authentication implementation
- **FR-006.2**: Support RBAC with roles: Admin, Radiologist, Clinician, Researcher, Viewer
- **FR-006.3**: Enforce session timeouts and concurrent session limits

### FR-008: Administrative Dashboard
- **FR-008.1**: Display system usage statistics and performance metrics
- **FR-008.2**: Monitor AI model performance and accuracy trends
- **FR-008.3**: Manage user accounts and role assignments
- **FR-008.4**: Configure institutional settings and branding
- **FR-008.5**: Generate compliance and audit reports
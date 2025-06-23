Object Formats
Object Formats
Task Object
Represents a processing task.

Fields
id (string): Unique identifier of the task.
type (string): Type of task ("video-to-shorts" or "video-to-video").
status (string): Current status of the task ("processing", "ready", "error").
created_at (string, ISO 8601 datetime): Timestamp when the task was created.
output_type (string): Type of output generated "project" or "folder".
output_id (string): Identifier of the output resource (e.g., project ID or folder ID).
Project Object
Represents a project containing generated shorts.

Fields
id (string): Unique identifier of the project.
author_id (string): ID of the user who created the project.
folder_id (string): ID of the folder containing the project.
name (string): Name of the project.
created_at (string, ISO 8601 datetime): Timestamp when the project was created.
virality_score (number): Predicted virality score of the project (range: 0 to 1).
virality_score_explanation (string): Explanation of the virality score.
Export Object
Represents an export task for a project.

Fields
id (string): Unique identifier of the export task.
status (string): Current status of the export ("processing", "ready", "error").
src_url (string or null): URL of the exported file. null until the export is completed.
project_id (string): ID of the project being exported.
created_at (string, ISO 8601 datetime): Timestamp when the export was initiated.
finished_at (string, ISO 8601 datetime or null): Timestamp when the export was completed. null if not yet completed.
name (string): Name of the export task.
author_id (string): ID of the user who initiated the export.
folder_id (string): ID of the folder containing the project.
descriptions (string): Description or notes about the export.
Additional Notes
Status Values: The status field in both Task and Export objects can have the following values:
"processing": Task has been created and is awaiting processing.
"ready": Task has been successfully completed.
"error": Task has failed to complete.
Time Format: All timestamps are in ISO 8601 format (e.g., "2023-10-01T12:00:00Z").
Error Handling: Error responses are not detailed here. Handle errors according to standard HTTP status codes and messages.
Example Workflows
Generating Shorts from a Video
Initiate Task

Send a POST request to /tasks/video-to-shorts with the required payload.

Check Task Status

Periodically send a GET request to /tasks/:task_id to check if the task is completed.

Retrieve Generated Projects

Once the task is completed, send a GET request to /projects/:folder_id to list the generated shorts. To get a single project, send a GET request to /projects/:project_id.

Exporting a Project
Initiate Export

Send a POST request to /projects/:folder_id/:project_id/exports with the required preset_id.

Check Export Status

Periodically send a GET request to /projects/:folder_id/:project_id/exports/:export_id to check if the export is completed.

Access Exported File

Once the export is completed, the src_url field will contain the URL to download the exported file.

Conclusion
This documentation provides detailed information about each API endpoint, including request payloads and return values. Use this guide to integrate the API into your application effectively.


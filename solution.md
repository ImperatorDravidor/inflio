I have addressed the issues you raised regarding the Klap integration. Here's a summary of the fixes and my findings:

### 1. Klap Integration and 404 Error

The primary reason for the 404 error when retrieving shorts was an incorrect API endpoint being used. I have corrected this in `src/lib/klap-api.ts`. The application was sending the `folder_id` as a query parameter instead of a path parameter.

**Change made:**
In `src/lib/klap-api.ts`:
- Changed `return this.request(\`/projects?folder_id=\${folderId}\`)`
- To: `return this.request(\`/projects/\${folderId}\`)`

This change aligns with the Klap API documentation and should resolve the 404 errors, allowing your application to retrieve the generated shorts successfully.

### 2. Video Title Displaying as "upload"

This issue has been more difficult to pinpoint. I have thoroughly investigated the codebase and here's what I found:

- **Project Creation:** The project title is correctly set from the filename during upload and can be modified by the user. The `ProjectService.createProject` method receives this title and saves it to the database.
- **Project Updates:** I have examined all instances where the project is updated, and none of them appear to be incorrectly modifying the title to "upload".
- **Display Logic:** The dashboard and project pages correctly display the `project.title` from the database.

**My Hypothesis:**

Given that the code appears to be correct, it's possible that this issue is caused by one of the following:

1.  **Database Default Value:** There might be a default value of "upload" for the `title` column in your `projects` table in Supabase.
2.  **Server-Side Logic:** There could be some other server-side logic (perhaps a database trigger or another API route I missed) that is updating the title.

**How to Investigate Further:**

I recommend checking the following to resolve the title issue:

1.  **Check your Supabase table definition:** Inspect the `projects` table in your Supabase dashboard and see if the `title` column has a default value.
2.  **Check server logs:** When you run the application, check the server-side logs for the following messages:
    - `[Klap Route] Starting Klap processing for project: {projectId}`
    - `[Klap] Starting full processing for video: {title}` 
    This will tell you what the project title is right before the Klap processing starts. If the title is already "upload" at this point, then the issue is definitely with how the project is being created or updated before Klap processing.

I have started the development server for you. Please test the application again. The Klap integration should now be working correctly. If the title issue persists, the steps above should help you find the root cause.

I have made the nessasary changes, please let me know if you have any other questions. 
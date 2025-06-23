Use Cases
Generate Shorts
Generate Shorts
This page explains how to use the Klap API to extract viral shorts from a long input video. Follow this end-to-end flow to go from an input video to exported shorts ready for social media.

Overview
Klap’s AI can analyze long videos and automatically extract the most interesting moments, turning them into viral-ready short clips with dynamic captions, AI reframing, and other enhancements.

API Flow
1. Submit a Video for Processing
First, submit your video to be analyzed and converted into shorts.

Endpoint Used: POST /tasks/video-to-shorts

Supported Input URL Formats:

YouTube links (e.g., https://www.youtube.com/watch?v=video_id)
Direct storage links:
Amazon S3 URLs (e.g., https://your-bucket.s3.amazonaws.com/video.mp4)
Google Cloud Storage URLs (e.g., https://storage.googleapis.com/your-bucket/video.mp4)
Other public HTTP/HTTPS URLs to video files
Note: Additional platforms like Google Drive and Twitch will be supported in future updates.

const task = await postRequest("/tasks/video-to-shorts", {
  source_video_url: "https://example.com/video.mp4",
  language: "en",
  max_duration: 30,
  max_clip_count: 5,
  editing_options: {
    intro_title: false,
  },
});
 
console.log(`Task created: ${task.id}`);
This returns a Task object with the ID of your processing job. Your video will be analyzed and segmented into shorts with your specified parameters.

2. Poll the Task Status
You’ll need to periodically check the status of your processing task until it completes.

Endpoint Used: GET /tasks/{task_id}

// Poll every 30 seconds until the task is complete
let currentTask;
do {
  currentTask = await getRequest(`/tasks/${task.id}`);
  console.log(`Task status: ${currentTask.status}`);
 
  if (currentTask.status === "processing") {
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
} while (currentTask.status === "processing");
 
if (currentTask.status === "error") {
  throw new Error("Task processing failed");
}
 
// Once complete, get the folder ID containing all generated shorts
const folderID = currentTask.output_id;
When the task is complete and successful, it will give you an output_id representing the folder containing all your generated shorts.

3. List Generated Shorts
Once processing is complete, you can retrieve all the shorts (projects) that were generated.

Endpoint Used: GET /projects/{folder_id}

const projects = await getRequest(`/projects/${folderID}`);
console.log(`Generated ${projects.length} shorts`);
 
// Each project has a virality score to help you identify the best clips
projects.forEach((project) => {
  console.log(`"${project.name}" - Virality Score: ${project.virality_score}`);
});
This returns an array of Project objects, each representing a short clip extracted from your video.

4. Preview a Short (Optional)
You can preview any generated short before exporting it.

const previewUrl = `https://klap.app/player/${projectID}`;
This URL can be used to preview the short or embed it in your application.

5. Export a Short
Select which shorts you want to export in their final form.

Endpoint Used: POST /projects/{folder_id}/{project_id}/exports

const exportTask = await postRequest(
  `/projects/${folderID}/${projectID}/exports`,
  {
    watermark: {
      src_url: "https://example.com/logo.png",
      pos_x: 0.5,
      pos_y: 0.5,
      scale: 1,
    },
  }
);
 
console.log(`Export started: ${exportTask.id}`);
This returns an Export object with details about your export job.

6. Poll the Export Status
Like with the initial processing, you need to poll until the export is complete.

Endpoint Used: GET /projects/{folder_id}/{project_id}/exports/{export_id}

// Poll until export is complete
let currentExport;
do {
  currentExport = await getRequest(
    `/projects/${folderID}/${projectID}/exports/${exportTask.id}`
  );
  console.log(`Export status: ${currentExport.status}`);
 
  if (currentExport.status === "processing") {
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
} while (currentExport.status === "processing");
 
if (currentExport.status === "error") {
  throw new Error("Export failed");
}
7. Access the Exported Video
When the export is complete, you’ll have a URL to the final video.

const videoUrl = currentExport.src_url;
console.log(`Export complete: ${videoUrl}`);
Complete Example
Here’s a full example of the process:

const API_URL = "https://api.klap.video/v2";
const API_KEY = "<your-api-key>";
const INPUT_VIDEO_URL = "<your-video-url>";
 
const postRequest = async (url, body = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
 
  return response.ok ? response.json() : Promise.reject(await response.json());
};
 
const getRequest = async (url) => {
  const response = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return response.json();
};
 
const pollStatus = async (url, checkKey, checkValue) => {
  let resJson;
 
  do {
    resJson = await getRequest(url);
    console.log(
      `[${new Date().toLocaleTimeString()}] Polling ${url} while ${checkKey} === ${checkValue}...`
    );
    await new Promise((r) => setTimeout(r, 30000));
  } while (resJson[checkKey] === checkValue);
  return resJson;
};
 
const generateShorts = async (inputVideoUrl) => {
  let task = await postRequest("/tasks/video-to-shorts", {
    source_video_url: inputVideoUrl,
    language: "en",
    max_duration: 30,
    max_clip_count: 2,
    editing_options: {
      intro_title: false,
    },
  });
 
  console.log(`Task created: ${task.id}. Processing...`);
  task = await pollStatus(`/tasks/${task.id}`, "status", "processing");
  console.log(`Task processing done: ${task.id}.`);
  if (task.status == "error") throw Error("Task processing failed.");
 
  const projectFolderId = task.output_id;
 
  console.log(`Result in folder: ${projectFolderId}`);
 
  const projects = await getRequest(`/projects/${projectFolderId}`);
  return projects;
};
 
const exportProject = async (folderId, projectId) => {
  const project = await getRequest(`/projects/${folderId}/${projectId}`);
  console.log(`Exporting project: ${project.id}...`);
  let exportRes = await postRequest(
    `/projects/${folderId}/${project.id}/exports`,
    {
      watermark: {
        src_url: "https://studio.restream.io/logos/default.png",
        pos_x: 0.5,
        pos_y: 0.5,
        scale: 1,
      },
    }
  );
  console.log(`Export started: ${exportRes.id}.`);
  exportRes = await pollStatus(
    `/projects/${folderId}/${project.id}/exports/${exportRes.id}`,
    "status",
    "processing"
  );
  if (exportRes.status == "error") throw Error("Export failed.");
  return exportRes;
};
 
const main = async () => {
  const projects = await generateShorts(INPUT_VIDEO_URL);
  console.log(`Generated ${projects.length} projects.`);
  projects.forEach((project) =>
    console.log(`"${project.name}" Virality Score: ${project.virality_score}`)
  );
 
  // export the first project
  const project = projects[0];
  const exportRes = await exportProject(project.folder_id, project.id);
  console.log(`Export done: ${exportRes.src_url}.`);
};
 
main();
Last updated on May 2, 2025

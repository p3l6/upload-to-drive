const actions = require("@actions/core");
const { google } = require("googleapis");
const fs = require("fs");
const glob = require("glob");

/** Google Service Account credentials  encoded in base64 */
const credentials = actions.getInput("credentials", { required: true });
/** Google Drive Folder ID to upload the file/folder to */
const folder = actions.getInput("folder", { required: true });
/** Glob pattern for the file(s) to upload */
const target = actions.getInput("target", { required: true });
/** Link to the Drive folder */
const link = "link";

const credentialsJSON = JSON.parse(Buffer.from(credentials, "base64").toString());
const scopes = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.JWT(credentialsJSON.client_email, null, credentialsJSON.private_key, scopes);
const drive = google.drive({ version: "v3", auth });

const driveLink = `https://drive.google.com/drive/folders/${folder}`;

async function main() {
  actions.setOutput(link, driveLink);

  const allFiles = glob.sync(target);
  const driveFiles = await listDriveFolder();

  for (file of allFiles) {
    const filename = file.split("/").pop();

    const existingItemId = driveFiles.get(filename);

    await uploadToDrive(filename, file, existingItemId);
  }
}

async function listDriveFolder() {
  const result = await drive.files.list({ q: `'${folder}' in parents and trashed = false` });
  const files = result.data.files;
  return new Map(files.map((f) => [f.name, f.id]));
}

/**
 * Uploads the file to Google Drive
 */
async function uploadToDrive(name, path, existingItemId) {
  try {
    const media = { body: fs.createReadStream(path) };

    if (existingItemId) {
      actions.info(`Updating file on Google Drive... ${path}`);
      await drive.files.update({
        fileId: existingItemId,
        media,
      });
    } else {
      actions.info(`Creating file on Google Drive... ${path}`);
      await drive.files.create({
        requestBody: {
          name,
          parents: [folder],
        },
        media,
      });
    }
    actions.info(`File uploaded successfully: ${name}`);
  } catch (e) {
    actions.error(`Upload failed: ${e}`);
    throw e;
  }
}

main().catch((e) => actions.setFailed(e));

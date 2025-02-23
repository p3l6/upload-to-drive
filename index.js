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

  // TODO: remove
  for (file of driveFiles) {
    actions.info(`${file.name} already exists at ${file.id}`);
  }

  for (file of allFiles) {
    const filename = file.split("/").pop();

    const existingItem = driveFiles.find((df) => df.name === filename);

    await uploadToDrive(filename, file, existingItem.id);
  }
}

async function listDriveFolder() {
  const result = await drive.files.list({ q: `'${folder}' in parents and trashed = false` });
  actions.info(`List Api result: ${result}`);
  const files = result.files;
  // TODO:  return a Map
  return files.map((f) => ({ name: f.name, id: f.id }));
}

/**
 * Uploads the file to Google Drive
 */
async function uploadToDrive(name, path, existingItemId) {
  actions.info(`Uploading file to Google Drive... ${path}`);
  try {
    if (existingItemId) {
      // TODO: modify the item with new content
    } else {
      await drive.files.create({
        requestBody: {
          name,
          parents: [folder],
        },
        media: {
          body: fs.createReadStream(path),
        },
      });
    }
    actions.info(`File uploaded successfully: ${name}`);
  } catch (e) {
    actions.error(`Upload failed: ${e}`);
    throw e;
  }
}

main().catch((e) => actions.setFailed(e));

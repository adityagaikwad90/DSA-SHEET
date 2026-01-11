import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const envVars = {
    region: import.meta.env.VITE_AWS_REGION,
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    bucket: import.meta.env.VITE_AWS_BUCKET_NAME
};

// Check for missing environment variables
const missingVars = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.warn("⚠️ Missing AWS Configuration:", missingVars.join(", "));
}

const s3Client = new S3Client({
    region: envVars.region,
    credentials: {
        accessKeyId: envVars.accessKeyId,
        secretAccessKey: envVars.secretAccessKey,
    },
});

export const uploadFile = async (file, path) => {
    // Convert File to Uint8Array to avoid "readableStream.getReader" error
    // which happens when AWS SDK tries to read the File as a stream for checksums
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const params = {
        Bucket: envVars.bucket,
        Key: path,
        Body: fileBuffer,
        ContentType: file.type,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // Construct the public URL (assuming public read access or presigned URL needed - for now using standard S3 URL format)
        // Note: For private buckets, you'd need to generate a presigned URL for viewing.
        // Assuming the user will configure the bucket for public read or we'll address access later.
        const url = `https://${envVars.bucket}.s3.${envVars.region}.amazonaws.com/${path}`;
        return url;
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        // Log detailed error for debugging
        if (error.Code) console.error("Error Code:", error.Code);
        if (error.Message) console.error("Error Message:", error.Message);
        if (error.$metadata) console.error("Error Metadata:", error.$metadata);

        throw error;
    }
};

export const deleteFile = async (path) => {
    const params = {
        Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
        Key: path,
    };

    try {
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        throw error;
    }
};

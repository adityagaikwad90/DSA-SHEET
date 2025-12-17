import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    },
});

export const uploadFile = async (file, path) => {
    // Convert File to Uint8Array to avoid "readableStream.getReader" error
    // which happens when AWS SDK tries to read the File as a stream for checksums
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const params = {
        Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
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
        const url = `https://${import.meta.env.VITE_AWS_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${path}`;
        return url;
    } catch (error) {
        console.error("Error uploading file to S3:", error);
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

import { connectToDB } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { createWorker } from 'tesseract.js';

const recognizeTextWithPosition = async (buffer: any) => {
  const worker = await createWorker(["eng", "chi_tra"], 1, { workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js" });

  const { data } = await worker.recognize(Buffer.from(buffer));
  await worker.terminate();

  return data.words.map((word) => ({
    text: word.text,
    bbox: word.bbox,
  }));
};

export async function POST(req: Request) {
  try {
    await connectToDB();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded', status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const db = mongoose.connection.getClient().db();
    const bucket = new GridFSBucket(db, { bucketName: 'media' });

    const readablePhotoStream = new Readable();
    readablePhotoStream.push(buffer);
    readablePhotoStream.push(null);

    const uploadStream = bucket.openUploadStream(file.name, {
      contentType: file.type,
    });

    const uploadPromise = new Promise<string>((resolve, reject) => {
      uploadStream.on('finish', () => {
        resolve(uploadStream.id.toString());
      });

      uploadStream.on('error', (uploadErr) => {
        reject(uploadErr);
      });
    });

    readablePhotoStream.pipe(uploadStream);

    const fileId = await uploadPromise;

    const ocrData = await recognizeTextWithPosition(buffer);

    return NextResponse.json({ message: 'File uploaded and OCR performed successfully', fileId, ocrData });
  } catch (err: any) {
    return NextResponse.json({ message: err.message, status: 500 });
  }
}

// export async function POST(req: Request) {
//   try {
//     await connectToDB();

//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ message: 'No file uploaded', status: 400 });
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = new Uint8Array(arrayBuffer);

//     const db = mongoose.connection.getClient().db();
//     const bucket = new GridFSBucket(db, { bucketName: 'media' });

//     const readablePhotoStream = new Readable();
//     readablePhotoStream.push(buffer);
//     readablePhotoStream.push(null);

//     const uploadStream = bucket.openUploadStream(file.name, {
//       contentType: file.type,
//     });

//     const uploadPromise = new Promise<string>((resolve, reject) => {
//       uploadStream.on('finish', () => {
//         resolve(uploadStream.id.toString());
//       });

//       uploadStream.on('error', (uploadErr) => {
//         reject(uploadErr);
//       });
//     });

//     readablePhotoStream.pipe(uploadStream);

//     const fileId = await uploadPromise;

//     const worker = await createWorker(["eng", "chi_tra"], 1, { workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js" });
//     const { data } = await worker.recognize(Buffer.from(buffer));
//     await worker.terminate();

//     return NextResponse.json({ message: 'File uploaded and OCR performed successfully', fileId, text: data.text });
//   } catch (err: any) {
//     return NextResponse.json({ message: err.message, status: 500 });
//   }
// }

export async function GET() {
  try {
    await connectToDB();

    const db = mongoose.connection.getClient().db();
    const bucket = new GridFSBucket(db, { bucketName: 'media' });

    const files = await bucket.find({ contentType: { $regex: '^image/' } }).toArray();

    return NextResponse.json({ status: 'success', files });
  } catch (err: any) {
    return NextResponse.json({ status: 'fail', message: err.message });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { connectToDB } from '@/lib/mongodb';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ status: 'fail', message: 'No image ID provided' });
    }

    try {
        await connectToDB();
        const db = mongoose.connection.getClient().db();
        const bucket = new GridFSBucket(db, { bucketName: 'media' });

        const fileDetails = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();
        if (!fileDetails.length) {
            return NextResponse.json({ status: 'fail', message: 'File not found' });
        }
        const file = fileDetails[0];
        const contentType = file.contentType;

        if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
            return NextResponse.json({ status: 'fail', message: 'Not an image' });
        }

        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));

        const readableStream = new ReadableStream({
            start(controller) {
                downloadStream.on('data', (chunk) => {
                    if (!controller.desiredSize) {
                        downloadStream.pause();
                    }
                    controller.enqueue(chunk);
                });
                downloadStream.on('end', () => controller.close());
                downloadStream.on('error', (err) => controller.error(err));
            },
            pull(controller) {
                if (downloadStream.isPaused()) {
                    downloadStream.resume();
                }
            },
            cancel() {
                downloadStream.destroy();
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': contentType,
            }
        });

    } catch (error: any) {
        console.error('Error fetching image:', error);
        return NextResponse.json({ status: 'fail', message: error.message });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ status: 'fail', message: 'No image ID provided' });
    }

    try {
        await connectToDB();
        const db = mongoose.connection.getClient().db();
        const bucket = new GridFSBucket(db, { bucketName: 'media' });

        await bucket.delete(new mongoose.Types.ObjectId(id));
        return NextResponse.json({ status: 'success', message: 'File deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ status: 'fail', message: error.message });
    }
}

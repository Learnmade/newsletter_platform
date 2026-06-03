import dbConnect from '@/lib/db';
import LiveMessage from '@/models/LiveMessage';
import LiveStream from '@/models/LiveStream';
import ActiveViewer from '@/models/ActiveViewer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// SSE endpoint — pushes live messages + reaction counts to ALL connected viewers every 2 seconds
export async function GET(request) {
    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
        async start(controller) {
            const send = (data) => {
                if (closed) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (_) { closed = true; }
            };

            // Send initial ping to confirm connection
            send({ type: 'connected' });

            const poll = async () => {
                if (closed) return;
                try {
                    await dbConnect();

                    // Get the current stream
                    const liveStream = await LiveStream.findOne()
                        .sort({ updatedAt: -1 })
                        .select('reactions status pinnedResource')
                        .lean();

                    if (!liveStream) {
                        send({ type: 'update', messages: [], reactions: { fire: 0, heart: 0, clap: 0, idea: 0 }, activeViewers: 0 });
                        return;
                    }

                    // Get real-time active viewer count (pinged in the last 15s)
                    const activeViewers = await ActiveViewer.countDocuments({
                        streamId: liveStream._id,
                        lastPing: { $gt: new Date(Date.now() - 15000) }
                    });

                    // Get latest 80 messages for this stream
                    const messages = await LiveMessage.find({ streamId: liveStream._id })
                        .sort({ createdAt: 1 })
                        .limit(80)
                        .lean();

                    send({
                        type: 'update',
                        messages: messages.map(m => ({
                            _id: m._id.toString(),
                            name: m.name,
                            text: m.text,
                            isCodeSnippet: m.isCodeSnippet,
                            language: m.language,
                            upvotes: m.upvotes,
                            createdAt: m.createdAt,
                        })),
                        reactions: liveStream.reactions || { fire: 0, heart: 0, clap: 0, idea: 0 },
                        status: liveStream.status,
                        pinnedResource: liveStream.pinnedResource || { title: '', url: '' },
                        activeViewers: activeViewers,
                    });
                } catch (err) {
                    // Don't crash SSE on DB error — just skip this tick
                }
            };

            // Poll every 2 seconds
            await poll();
            const interval = setInterval(poll, 2000);

            // Clean up when client disconnects
            request.signal.addEventListener('abort', () => {
                closed = true;
                clearInterval(interval);
                try { controller.close(); } catch (_) {}
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Important for Nginx proxies
        },
    });
}

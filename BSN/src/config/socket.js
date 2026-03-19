const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Store io instance for use by controllers
let ioInstance = null;

const getIO = () => ioInstance;

// Initialize Socket.IO server and attach JWT auth middleware
const initSocket = (httpServer, options = {}) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            credentials: true
        },
        ...options
    });

    ioInstance = io;

    // JWT auth middleware for Socket.IO
    io.use((socket, next) => {
        try {
            const token = socket.handshake?.auth?.token
                || (socket.handshake?.headers?.authorization || '').split(' ')[1]
                || socket.handshake?.query?.token;

            if (!token) return next(new Error('Authentication error: token required'));

            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.data.user = payload;
            return next();
        } catch (err) {
            return next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const uid = socket.data?.user?.id || 'unknown';
        console.log(`Socket connected: ${socket.id} (user: ${uid})`);

        // Auto-join user to their personal room for notifications
        socket.join(`user:${uid}`);

        // ── Messaging events ──

        // Join a conversation room
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conv:${conversationId}`);
        });

        // Leave a conversation room
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conv:${conversationId}`);
        });

        // Send message — broadcast to conversation room
        socket.on('send_message', (data) => {
            const { conversationId, message } = data;
            socket.to(`conv:${conversationId}`).emit('new_message', {
                conversationId,
                message
            });
        });

        // Typing indicators
        socket.on('typing', (data) => {
            const { conversationId } = data;
            socket.to(`conv:${conversationId}`).emit('user_typing', {
                conversationId,
                userId: uid,
                username: socket.data.user.username || 'User'
            });
        });

        socket.on('stop_typing', (data) => {
            const { conversationId } = data;
            socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
                conversationId,
                userId: uid
            });
        });

        // Mark messages as read
        socket.on('message_read', (data) => {
            const { conversationId } = data;
            socket.to(`conv:${conversationId}`).emit('messages_read', {
                conversationId,
                readBy: uid
            });
        });

        // ── Conference events ──

        socket.on('conference_join', (data) => {
            const { channelName } = data;
            socket.join(`conf:${channelName}`);
            socket.to(`conf:${channelName}`).emit('participant_joined', {
                userId: uid,
                socketId: socket.id
            });
        });

        socket.on('conference_leave', (data) => {
            const { channelName } = data;
            socket.to(`conf:${channelName}`).emit('participant_left', {
                userId: uid,
                socketId: socket.id
            });
            socket.leave(`conf:${channelName}`);
        });

        socket.on('conference_end', (data) => {
            const { channelName } = data;
            io.to(`conf:${channelName}`).emit('conference_ended', {
                endedBy: uid
            });
        });

        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id} (reason: ${reason})`);
        });
    });

    return io;
};

module.exports = {
    initSocket,
    getIO
};

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 30],
            isAlphanumeric: true
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [6, 100]
        }
    },
    fullName: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    coverPhoto: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    role: {
        type: DataTypes.ENUM('user', 'moderator', 'admin'),
        allowNull: false,
        defaultValue: 'user'
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    businessType: {
        type: DataTypes.ENUM('startup', 'smb', 'enterprise', 'freelancer', 'investor', 'enthusiast'),
        allowNull: true
    },
    industry: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    party: {
    type: DataTypes.STRING(100),
    allowNull: true,
    },
    partyVisibility: {
    type: DataTypes.ENUM('public', 'private'),
    allowNull: false,
    defaultValue: 'private'
    }
}, {
    timestamps: true,
    tableName: 'users'
});

//HASH PASS
User.beforeCreate(async (user, options) => {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
});

//compare password
User.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

module.exports = User;


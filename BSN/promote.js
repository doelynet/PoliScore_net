//Admin promotion script 
const { User } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function promote() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { username: 'Watanabe101' } });
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log('User Watanabe101 promoted to admin');
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
promote();

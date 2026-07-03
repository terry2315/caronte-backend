const homeUser = async (req, res) => {
    const user = req.user;

    return res.status(200).json({
        status: 'success',
        message: 'Acceso autorizado a home-user',
        isAuthenticated: true,
        user: {
            id: user._id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            profileCompleted: user.profileCompleted,
            avatar: user.avatar
        }
    });
};

export default homeUser;
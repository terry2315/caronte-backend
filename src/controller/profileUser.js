const profileUser = async (req, res) => {

    const user = req.user;

    return res.status(200).json({
        status: 'success',
        message: 'Perfil obtenido correctament',
        profile: {
            id: user._id,
            name: user.name,
            lastName: user.lastName,
            age: user.age,
            email: user.email,
            phone: user.phone,
            nationality: user.nationality,
            avatar: user.avatar,
            authProvider: user.authProvider,
            isEmailVerified: user.isEmailVerified,
            profileCompleted: user.profileCompleted,
            rol: user.role,
            createAt: user.createAt,
            updateAt: user.updateAt
        }
    });
}

export default profileUser;
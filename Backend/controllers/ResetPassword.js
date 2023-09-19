const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.resetPasswordToken = async (req, res) => {
    try {
        const email = req.body.email;

        const user = await User.findOne({ email: email });

        if (!user) {
            return res.json({
                success: false,
                message: 'Your Email is not register with us'
            })
        }

        const token = crypto.randomBytes(20).toString("hex");

        const updateDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                reserPasswordExpires: Date.now() + 5 * 60 * 100000000
            },
            { new: true });

        const url = `http://localhost:3000/update-password/${token}`;

        await mailSender(email,
            "Password Reset",
            `Password Reset Link: ${url}`);

        return res.json({
            success: true,
            message: "Email sent successfully"
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password not matching"
            });
        }

        const userDetails = await User.findOne({token:token});

        if(!userDetails){
            return res.json({
                success:false,
                message:"Token is invalid"
            })
        }

        if ((userDetails.resetPasswordExpires < Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}
		const encryptedPassword = await bcrypt.hash(password, 10);
		await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
		);
		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
    }
    catch (error) {
        return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
    }
}
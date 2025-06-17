import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schema/user.schema';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>
    ) { }

    async findAll(): Promise<User[]> {
        return await this.userModel.find().exec();
    }

    async findById(id: string): Promise<User> {
        const user = await this.userModel.findById(new Types.ObjectId(id)).select("-password -token");
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async findByRefreshToken(token: string): Promise<User | null> {
        const user = await this.userModel.findOne({ token }).select("-password");
        if (!user) {
            throw new NotFoundException('User not found with the provided token');
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.userModel.findOne({ email });
        return user;
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const newUser = new this.userModel(createUserDto);
        return await newUser.save();
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const updatedUser = await this.userModel
            .findByIdAndUpdate(new Types.ObjectId(id), updateUserDto, { new: true }).select("-password -token")
            .exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return updatedUser;
    }

    async deleteUser(id: string): Promise<void> {
        const result = await this.userModel.findByIdAndDelete(new Types.ObjectId(id));
        if (!result) {
            throw new NotFoundException('User not found');
        }
    }

    // Add this method specifically for token updates
    async updateRefreshToken(userId: string, refreshToken: string): Promise<User> {
        if (!Types.ObjectId.isValid(userId)) {
            throw new NotFoundException('Invalid user ID format');
        }

        const updatedUser = await this.userModel
            .findByIdAndUpdate(
                userId,
                { token: refreshToken }, // Direct field update, bypassing DTO
                { new: true }
            )
            .exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return updatedUser;
    }

    // Alternative method for clearing token
    async clearRefreshToken(userId: string): Promise<User> {
        return this.updateRefreshToken(userId, "");
    }
}
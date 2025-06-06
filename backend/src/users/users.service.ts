import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, IsObjectIdPipe, ParseObjectIdPipe } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model, ObjectId, Types } from 'mongoose';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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

    async findByEmail(email: string): Promise<User | null> {
        const user =  await this.userModel.findOne({ email });
        return user;
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const newUser = new this.userModel(createUserDto);
        return await newUser.save();
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const updatedUser = await this.userModel
            .findByIdAndUpdate(new Types.ObjectId(id), updateUserDto, { new: true }).select("-password -toke")
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
}
import { 
    Body, 
    Controller, 
    Get, 
    Param, 
    Post,
    Delete,
    HttpStatus,
    HttpCode,
    Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { User } from './schema/user.schema';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@Controller('users')
export class UsersController {
    constructor(private userService: UsersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
        return await this.userService.createUser(createUserDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllUsers(): Promise<User[]> {
        return await this.userService.findAll();
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getUserById(@Param('id') id: string): Promise<User> {
        return await this.userService.findById(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto
    ): Promise<User> {
        return await this.userService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUser(@Param('id') id: string): Promise<void> {
        await this.userService.deleteUser(id);
    }
}
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './schema/subjects.schema';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';
import { SubjectStats } from 'common/types';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get("all")
  @HttpCode(HttpStatus.OK)
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.findAll();
  }

  @Post("create-subject")
  @HttpCode(HttpStatus.CREATED)
  async createSubject(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get("get-subjects-by-id/:id")
  @HttpCode(HttpStatus.OK)
  async getSubjectsById(@Param('id') id: string): Promise<Subject> {
    return this.subjectsService.findById(id);
  }

  @Get("get-subjects-by-name/:subjectName") 
  @HttpCode(HttpStatus.OK)
  async getSubjectsByName(@Param('subjectName') subjectName: string): Promise<Subject | null> {
    return this.subjectsService.findByName(subjectName);
  }

  @Patch("update-subject/:id")
  @HttpCode(HttpStatus.OK)
  async updateSubject(@Param('id') id: string,@Body() updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete("remove-subject/:id")
  @HttpCode(HttpStatus.OK)
  async deleteSubjectById(@Param('id') id : string) : Promise<{
    message : string,
    status : boolean
  }> {
    const status =  await this.subjectsService.remove(id);
    return {
      message : "The subject is successfully deleted",
      status : status
    }
  }

  @Get("get-subject-stats/:id")
  @HttpCode(HttpStatus.OK)
  async getSubjectStats(@Param('id') id : string): Promise<{ subjectStats: SubjectStats | null; message: string }> {
    return this.subjectsService.getSubjectStats(id);
  }
}

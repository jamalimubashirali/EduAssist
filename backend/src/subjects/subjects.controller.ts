import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './schema/subjects.schema';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get("all")
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.findAll();
  }

  @Post("create-subject")
  async createSubject(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get("get-subjects-by-id")
  async getSubjectsById(@Param('id') id: string): Promise<Subject> {
    return this.subjectsService.findById(id);
  }

  @Get("get-subjects-by-name")
  async getSubjectsByName(@Param('subjectName') subjectName: string): Promise<Subject | null> {
    return this.subjectsService.findByName(subjectName);
  }

  @Patch("update-subject")
  async updateSubject(@Param('id') id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete("remove-subject")
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

  @Get("get-subject-stats")
  async getSubjectStats(@Param('id') id : string): Promise<any> {
    return this.subjectsService.getSubjectStats(id);
  }
}

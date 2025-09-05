import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './schema/subjects.schema';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';
import { SubjectStats } from 'common/types';
import { TextUtils } from 'common/utils/text.utils';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}
  @Get("all")
  @HttpCode(HttpStatus.OK)
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.findAll();
  }

  @Get("get-subjects")
  @HttpCode(HttpStatus.OK)
  async getSubjects(): Promise<Subject[]> {
    return this.subjectsService.findAll();
  }

  @Get("popular")
  @HttpCode(HttpStatus.OK)
  async getPopularSubjects(): Promise<Subject[]> {
    // Return top 5 subjects for now - this can be enhanced with actual popularity metrics
    const allSubjects = await this.subjectsService.findAll();
    return allSubjects.slice(0, 5);
  }

  @Post("create-subject")
  @HttpCode(HttpStatus.CREATED)
  async createSubject(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
    if (createSubjectDto.subjectName) {
      createSubjectDto.subjectName = TextUtils.toTitleCase(createSubjectDto.subjectName);
    }
    if (createSubjectDto.subjectDescription) {
      createSubjectDto.subjectDescription = TextUtils.toSentenceCase(createSubjectDto.subjectDescription);
    }
    
    return this.subjectsService.create(createSubjectDto);
  }

  @Get("get-subject-by-id/:subjectId")
  @HttpCode(HttpStatus.OK)
  async getSubjectsById(@Param('subjectId') subjectId: string): Promise<Subject> {
    return this.subjectsService.findById(subjectId);
  }

  @Get("get-subject-by-name/:subjectName") 
  @HttpCode(HttpStatus.OK)
  async getSubjectsByName(@Param('subjectName') subjectName: string): Promise<Subject | null> {
    const capitalizedName = TextUtils.toTitleCase(subjectName);
    return this.subjectsService.findByName(capitalizedName);
  }

  @Patch("update-subject/:subjectId")
  @HttpCode(HttpStatus.OK)
  async updateSubject(@Param('subjectId') subjectId: string, @Body() updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    if (updateSubjectDto.subjectName) {
      updateSubjectDto.subjectName = TextUtils.toTitleCase(updateSubjectDto.subjectName);
    }
    if (updateSubjectDto.subjectDescription) {
      updateSubjectDto.subjectDescription = TextUtils.toSentenceCase(updateSubjectDto.subjectDescription);
    }
    
    return this.subjectsService.update(subjectId, updateSubjectDto);
  }

  @Delete("remove-subject/:subjectId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubjectById(@Param('subjectId') subjectId: string): Promise<void> {
    await this.subjectsService.remove(subjectId);
  }
  @Get("get-subject-stats/:subjectId")
  @HttpCode(HttpStatus.OK)
  async getSubjectStats(@Param('subjectId') subjectId: string): Promise<{ subjectStats: SubjectStats | null; message: string }> {
    return this.subjectsService.getSubjectStats(subjectId);
  }

  @Get("search")
  @HttpCode(HttpStatus.OK)
  async searchSubjects(@Query('q') query: string): Promise<Subject[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.subjectsService.searchSubjects(query.trim());
  }
}

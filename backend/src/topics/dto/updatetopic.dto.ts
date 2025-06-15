import { PartialType } from "@nestjs/mapped-types";
import { CreateTopicDto } from "./createtopic.dto";

export class UpdateTopicDto extends PartialType(CreateTopicDto) { }
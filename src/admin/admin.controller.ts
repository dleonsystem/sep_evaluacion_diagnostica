import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/pdfs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadPdf(@UploadedFile() file?: Express.Multer.File) {
    return {
      ok: true,
      filename: file?.originalname ?? null,
      message: file ? 'PDF recibido.' : 'No se recibió archivo.',
    };
  }
}

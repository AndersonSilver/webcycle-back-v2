import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.body);
    // whitelist: remove campos não declarados (anti mass-assignment)
    // forbidNonWhitelisted: false — clientes legados/admin podem enviar campos extras
    // sem quebrar com 400; o excesso é simplesmente descartado
    const errors: ValidationError[] = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));

      res.status(400).json({
        message: 'Dados inválidos',
        errors: formattedErrors,
      });
      return;
    }

    req.body = dto;
    next();
  };
}


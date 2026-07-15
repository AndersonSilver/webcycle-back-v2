/** Remove campos sensíveis de produtos em respostas públicas */
export function sanitizeProductPublic<T extends Record<string, any>>(product: T): Omit<T, 'digitalFileUrl'> {
  if (!product) return product;
  const { digitalFileUrl: _omit, ...rest } = product;
  return rest as Omit<T, 'digitalFileUrl'>;
}

export function sanitizeProductsPublic<T extends Record<string, any>>(products: T[]): Array<Omit<T, 'digitalFileUrl'>> {
  return products.map((p) => sanitizeProductPublic(p));
}

/** Remove URLs de vídeo das aulas em respostas de catálogo */
export function sanitizeLessonPublic<T extends Record<string, any>>(lesson: T): Omit<T, 'videoUrl'> {
  if (!lesson) return lesson;
  const { videoUrl: _omit, ...rest } = lesson;
  return rest as Omit<T, 'videoUrl'>;
}

export function stripLessonVideoUrlsDeep(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map(stripLessonVideoUrlsDeep);
  }
  if (payload && typeof payload === 'object') {
    const obj = { ...(payload as Record<string, unknown>) };
    if ('videoUrl' in obj && 'moduleId' in obj) {
      delete obj.videoUrl;
    }
    if ('lessons' in obj && Array.isArray(obj.lessons)) {
      obj.lessons = obj.lessons.map(stripLessonVideoUrlsDeep);
    }
    if ('modules' in obj && Array.isArray(obj.modules)) {
      obj.modules = obj.modules.map(stripLessonVideoUrlsDeep);
    }
    return obj;
  }
  return payload;
}

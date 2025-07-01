import { z } from "zod";

/**
 * A safe JSON parser that can handle and validate complex nested objects.
 * It ensures that even if parts of the JSON are malformed or missing,
 * the application can still proceed with the valid parts.
 *
 * @template T - A Zod schema for validation.
 */
export class SafeJsonParser<T extends z.ZodType<any, any>> {
  private schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }

  /**
   * Parses a JSON string and validates it against the schema.
   * If parsing or validation fails, it returns a default value.
   *
   * @param jsonString - The JSON string to parse.
   * @param defaultValue - The value to return on failure.
   * @returns The parsed and validated data, or the default value.
   */
  parse(jsonString: string | null | undefined, defaultValue: z.infer<T>): z.infer<T> {
    if (!jsonString) {
      return defaultValue;
    }
    try {
      const data = JSON.parse(jsonString);
      const validation = this.schema.safeParse(data);
      if (validation.success) {
        return validation.data;
      } else {
        console.warn("JSON validation failed:", validation.error.errors);
        return defaultValue;
      }
    } catch (error) {
      console.warn("JSON parsing failed:", error);
      return defaultValue;
    }
  }

  /**
   * A static method to safely get a value from a nested object.
   *
   * @param obj - The object to search within.
   * @param path - The path to the desired value (e.g., 'a.b.c').
   * @param defaultValue - The value to return if the path is not found.
   * @returns The value at the specified path, or the default value.
   */
  static get<U>(obj: any, path: string, defaultValue: U): U {
    if (typeof obj !== 'object' || obj === null) {
      return defaultValue;
    }

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (typeof current !== 'object' || current === null || !key || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }
}

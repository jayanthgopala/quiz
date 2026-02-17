import { z } from "zod";

export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        issues: parsed.error.flatten()
      });
    }

    next();
  };
}

export const authSchemas = {
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })
  }),
  createUser: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["Admin", "Principal", "Professor", "StudentProctor", "Student"]),
      department: z.string().optional(),
      proctorId: z.string().optional()
    })
  })
};

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const examSchemas = {
  examIdParam: z.object({
    params: z.object({
      examId: objectId
    })
  }),
  createExam: z.object({
    body: z.object({
      title: z.string().min(3),
      questions: z.array(objectId).min(1),
      duration: z.number().int().min(1).max(600),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      assignedBatch: z.string().min(1),
      attemptLimit: z.number().int().min(1).max(10).optional(),
      randomizeQuestions: z.boolean().optional(),
      shuffleOptions: z.boolean().optional()
    })
  }),
  submitExam: z.object({
    params: z.object({
      examId: objectId
    }),
    body: z.object({
      attemptId: objectId,
      sessionToken: z.string().min(20),
      answers: z
        .array(
          z.object({
            questionId: objectId,
            answer: z.any()
          })
        )
        .default([]),
      violationFlags: z.array(z.string().min(1)).optional()
    })
  })
};

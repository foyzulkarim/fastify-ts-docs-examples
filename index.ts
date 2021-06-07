import fastify from "fastify";
import { Static, Type } from '@sinclair/typebox'
import { FromSchema } from "json-schema-to-ts";

// import json schemas as normal
import QuerystringSchema from "./schemas/querystring.json";
import HeadersSchema from "./schemas/headers.json";
import TodoSchema from "./schemas/todo.json";

// import the generated interfaces
import { QuerystringSchema as QuerystringSchemaInterface } from "./types/querystring";
import { HeadersSchema as HeadersSchemaInterface } from "./types/headers";
import { Todo } from "./types/todo";

const server = fastify();

server.get<{
  Querystring: QuerystringSchemaInterface;
  Headers: HeadersSchemaInterface;
}>(
  "/auth",
  {
    schema: {
      querystring: QuerystringSchema,
      headers: HeadersSchema,
    },
    preValidation: async (request, reply) => {
      const { username, password } = request.query;
      // done(username !== "admin" ? new Error("Must be admin") : undefined);
      return username !== "admin" ? new Error("Must be admin") : undefined;
    },
  },
  async (request, reply) => {
    const customerHeader = request.headers["h-Custom"];
    // do something with request data
    return `logged in!`;
  }
);

const User = Type.Object({
  name: Type.String(),
  description: Type.String(),
  mail: Type.Optional(Type.String({ format: "email" })),
});
type UserType = Static<typeof User>;

server.post<{ Body: UserType; Response: UserType }>(
  "/user",
  {
    schema: {
      body: User,
      response: {
        200: User,
      },
    },
  },
  async (req, rep) => {
    const { body: user } = req;
    console.log(user.name);    
    rep.status(200).send(user);
  }
);

server.route<{
  Querystring: QuerystringSchemaInterface;
  Headers: HeadersSchemaInterface;
}>({
  method: "GET",
  url: "/auth2",
  schema: {
    querystring: QuerystringSchema,
    headers: HeadersSchema,
  },
  preHandler: async (request, reply) => {
    const { username, password } = request.query;
    const customerHeader = request.headers["h-Custom"];
    return;
  },
  handler: (request, reply) => {
    const { username, password } = request.query;
    const customerHeader = request.headers["h-Custom"];
    console.log("handled");

    reply.status(200).send({ username });
  },
});

server.post<{ Body: Todo }>(
  "/todo",
  {
    schema: {
      body: TodoSchema,
      response: {
        201: TodoSchema,
      },
    },
  },
  async (request, reply): Promise<void> => {
    const todo = request.body as Todo;

    reply
      .status(201)
      // .send({ description: "hello" }); // will throw error (intentional)
      .send(todo);
  }
);


const TodoSchema2 = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    done: { type: 'boolean' },
  },
  required: ['name'],
} as const;

server.post<{ Body: FromSchema<typeof TodoSchema2> }>(
  '/todo2',
  {
    schema: {
      body: TodoSchema2,
      response: {
        201: {
          type: 'string',
        },
      },
    }
  },
  async (request, reply): Promise<void> => {
    const todoObj : FromSchema<typeof TodoSchema2> = request.body;
    console.log(todoObj.name);     // will not throw type error
    // request.body.notthere // will throw type error 

    reply.status(201).send();
  },
);

server.listen(3000, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(0);
  }
  console.log(`Server listening at ${address}`);
});

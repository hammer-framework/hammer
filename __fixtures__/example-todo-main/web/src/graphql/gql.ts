/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  mutation AddTodo_CreateTodo($body: String!) {\n    createTodo(body: $body) {\n      id\n      __typename\n      body\n      status\n    }\n  }\n": types.AddTodo_CreateTodoDocument,
    "\n  query NumTodosCell_GetCount {\n    todosCount\n  }\n": types.NumTodosCell_GetCountDocument,
    "\n  query TodoListCell_GetTodos {\n    todos {\n      id\n      body\n      status\n    }\n  }\n": types.TodoListCell_GetTodosDocument,
    "\n  mutation TodoListCell_CheckTodo($id: Int!, $status: String!) {\n    updateTodoStatus(id: $id, status: $status) {\n      id\n      __typename\n      status\n    }\n  }\n": types.TodoListCell_CheckTodoDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddTodo_CreateTodo($body: String!) {\n    createTodo(body: $body) {\n      id\n      __typename\n      body\n      status\n    }\n  }\n"): typeof import('./graphql').AddTodo_CreateTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NumTodosCell_GetCount {\n    todosCount\n  }\n"): typeof import('./graphql').NumTodosCell_GetCountDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TodoListCell_GetTodos {\n    todos {\n      id\n      body\n      status\n    }\n  }\n"): typeof import('./graphql').TodoListCell_GetTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TodoListCell_CheckTodo($id: Int!, $status: String!) {\n    updateTodoStatus(id: $id, status: $status) {\n      id\n      __typename\n      status\n    }\n  }\n"): typeof import('./graphql').TodoListCell_CheckTodoDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

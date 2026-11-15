import {
  ActionBuilder,
  MutationBuilder,
  QueryBuilder,
  GenericDataModel,
} from "convex/server";

export declare const query: QueryBuilder<GenericDataModel, "public">;
export declare const mutation: MutationBuilder<GenericDataModel, "public">;
export declare const action: ActionBuilder<GenericDataModel, "public">;
export declare const internalAction: ActionBuilder<GenericDataModel, "internal">;
export declare const internalMutation: MutationBuilder<GenericDataModel, "internal">;
export declare const internalQuery: QueryBuilder<GenericDataModel, "internal">;

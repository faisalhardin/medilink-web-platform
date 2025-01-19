
export type Id = number | string;

export type JourneyPoint = {
    id: Id;
    name: string;
} 

export type Task = {
    id: Id;
    columnId: Id;
    content: string;
  };
  
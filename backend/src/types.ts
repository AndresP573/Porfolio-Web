export type ProjectStatus = "Publicado" | "En desarrollo" | "Borrador";

export interface Proyecto {
  id?: number;
  name: string;
  description: string;
  technologies: string[];
  image: string;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ProyectoInput = {
  nombre?: string;
  descripcion?: string;
  tecnologias?: string[] | string;
  imagen?: string;
  estado?: string;
  name?: string;
  description?: string;
  technologies?: string[] | string;
  image?: string;
  status?: string;
};

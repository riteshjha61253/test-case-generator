export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
}
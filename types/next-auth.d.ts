import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      nickname?: string;
      profileImage?: string;
    };
  }
  interface User {
    username?: string;
    nickname?: string;
    profileImage?: string;
  }
}

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

// Log to confirm this file is loaded with the correct version
console.log("[NextAuth] Initializing auth route handler with backend-direct URL");

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Mobile Number",
      credentials: {
        mobileNumber: { label: "Mobile Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.mobileNumber || !credentials?.password) {
          console.error("Missing credentials");
          return null;
        }

        try {
          console.log(`Login attempt with mobile number: ${credentials.mobileNumber}`);
          
          // IMPORTANT: For Docker networking, we must use 'backend' service name, not localhost
          // NextAuth runs server-side, so process.env.NEXT_PUBLIC_API_URL will resolve to the client-side URL
          // which won't work from within the container
          const apiUrl = 'http://backend:8000';
          console.log(`Using fixed container API URL: ${apiUrl}`);

          // Create form data with proper format expected by FastAPI OAuth2
          const formData = new URLSearchParams();
          formData.append('username', credentials.mobileNumber); // Map mobileNumber to username for backend
          formData.append('password', credentials.password);
          
          console.log(`Sending login request to ${apiUrl}/auth/login`);
          console.log(`Form data: username=${credentials.mobileNumber}, password=******`);
          
          try {
            // First try with form-urlencoded format (what FastAPI's OAuth2PasswordRequestForm expects)
            const response = await axios.post(
              `${apiUrl}/auth/login`,
              formData.toString(),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              }
            );

            if (response.data && response.data.access_token) {
              console.log("Login successful, got token");
              return {
                id: "1", // Will be properly set in the JWT callback
                mobileNumber: credentials.mobileNumber,
                token: response.data.access_token,
              };
            } else {
              console.error("No token received from API");
              return null;
            }
          } catch (apiError: any) {
            console.error("Form-urlencoded request failed, trying with JSON format as fallback");
            console.error(`Error details: ${apiError.message}`);
            
            let errorMessage = "Authentication failed";
            
            if (apiError.response) {
              console.error(`Status: ${apiError.response.status}, Data:`, apiError.response.data);
              if (apiError.response.data && apiError.response.data.detail) {
                errorMessage = apiError.response.data.detail;
              } else if (apiError.response.status === 401) {
                errorMessage = "Invalid mobile number or password";
              } else if (apiError.response.status === 500) {
                errorMessage = "Server error, please try again later";
              }
            } else if (apiError.request) {
              console.error("No response received from server");
              errorMessage = "Could not connect to authentication server";
            } else {
              errorMessage = apiError.message || "Authentication request failed";
            }
            
            // Fallback to JSON format as some FastAPI implementations might expect this
            try {
              console.log("Trying JSON format as fallback");
              const jsonResponse = await axios.post(
                `${apiUrl}/auth/login`,
                {
                  // Important: Use username here, not mobileNumber
                  username: credentials.mobileNumber,
                  password: credentials.password,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              if (jsonResponse.data && jsonResponse.data.access_token) {
                console.log("Login successful with JSON format, got token");
                return {
                  id: "1",
                  mobileNumber: credentials.mobileNumber,
                  token: jsonResponse.data.access_token,
                };
              }
            } catch (jsonError: any) {
              console.error("JSON format login also failed");
              console.error(`Error details: ${jsonError.message}`);
              
              if (jsonError.response) {
                console.error(`Status: ${jsonError.response.status}, Data:`, jsonError.response.data);
                
                // Update error message if we have better info from JSON attempt
                if (jsonError.response.data && jsonError.response.data.detail) {
                  errorMessage = jsonError.response.data.detail;
                }
              }
            }
            
            // Throw error with the best message we have
            throw new Error(errorMessage);
          }
        } catch (error: any) {
          console.error("Auth error:", error);
          if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
          }
          throw error; // Re-throw the error to ensure it's passed back to the client
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback: setting user data", user);
        token.mobileNumber = user.mobileNumber;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback: setting session data", token);
      session.user = session.user || {};
      session.user.mobileNumber = token.mobileNumber;
      
      // For authenticated API requests
      session.accessToken = token.accessToken;
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: true, // Always enable debug mode to see full errors
});

export { handler as GET, handler as POST }; 
using ChatAPI.Models;
using Microsoft.AspNetCore.Identity;
using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using ChatAPI.Common;
using ChatAPI.Services;
using ChatAPI.DTOs;
using ChatAPI.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ChatAPI.Endpoints
{
    public static class AccountEndpoint
    {
        public static RouteGroupBuilder MapAccountEndpoint(this WebApplication app)
        {
            var group = app.MapGroup("/api/account").WithTags("account");

            group.MapPost("/register", async (HttpContext context, UserManager<AppUser> userManager,
                [FromForm] string fullName, [FromForm] string email, [FromForm] string password,
                [FromForm] string userName, [FromForm] IFormFile? profileImage) =>
            {
                var userFromDb = await userManager.FindByEmailAsync(email);

                if (userFromDb is not null)
                {
                    return Results.BadRequest(Response<string>.Failure("User is already exist."));
                }

                if (profileImage is null)
                {
                    return Results.BadRequest(Response<string>.Failure("Profile image is required"));
                }

                var picture = await FileUpload.Upload(profileImage, context);

                var user = new AppUser
                {
                    Email = email,
                    FullName = fullName,
                    UserName = userName,
                    ProfileImage = picture
                };

                var result = await userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    var messages = result.Errors.Select(e => e.Description);
                    Console.WriteLine("Identity errors: " + string.Join(", ", messages));

                    return Results.BadRequest(Response<string>.Failure(string.Join(", ", messages)));
                }

                return Results.Ok(Response<string>.Success("", "User created sucessfully."));

            }).DisableAntiforgery();

            group.MapPost("/login", async (UserManager<AppUser> userManager, TokenService tokenService, LoginDto dto) =>
            {
                if (dto is null)
                {
                    return Results.BadRequest(Response<string>.Failure("Invalid login details"));
                }

                var user = await userManager.FindByEmailAsync(dto.Email);

                if (user == null)
                {
                    return Results.BadRequest(Response<string>.Failure("User not found"));
                }

                var result = await userManager.CheckPasswordAsync(user!, dto.Password);

                if (!result)
                {
                    return Results.BadRequest(Response<string>.Failure("Invalid password"));
                }

                var token = tokenService.GenerateToken(user.Id, user.UserName!);

                return Results.Ok(Response<string>.Success(token, "Login successfully"));
            });

            group.MapGet("/me", async (HttpContext context, UserManager<AppUser> userManager) =>
            {
                var currentLoggedInUserId = context.User.GetUserId()!;

                var currentLoggedInUser = await userManager.Users.SingleOrDefaultAsync(x => x.Id == currentLoggedInUserId
                .ToString());

                return Results.Ok(Response<AppUser>.Success(currentLoggedInUser!, "User fetched successfully"));
            }).RequireAuthorization();

            return group;
        }
    }
}

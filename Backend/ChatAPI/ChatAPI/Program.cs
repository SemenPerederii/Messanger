using ChatAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ChatAPI.Endpoints;
using ChatAPI.Services;
using ChatAPI.Data;
using ChatAPI.Hubs;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(
    option =>
    {
        option.AddDefaultPolicy(builder =>
        {
            builder.WithOrigins("http://localhost:4200", "http://localhost:4200")
            .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        });
    });

var JwtSetting = builder.Configuration.GetSection("JWTSettings");

// Add services to the container.

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddIdentityCore<AppUser>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<TokenService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(option =>
{
    option.SaveToken = true;
    option.RequireHttpsMetadata = false;
    option.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(JwtSetting["SecurityKey"]!)
        ),
        ValidateIssuer = false,
        ValidateAudience = false
    };

    option.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty( accessToken ) && path.StartsWithSegments("/hus"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(x => x.AllowAnyHeader().AllowAnyHeader()
.AllowCredentials()
.WithOrigins("http://localhost:4200", "http://localhost:4200"));


app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapHub<ChatHub>("hubs/chat");
app.MapAccountEndpoint();

app.MapGet("/", () => "Server is running!");
app.MapPost("/test", () => "It works!");

app.Run();

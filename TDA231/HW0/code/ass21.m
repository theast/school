clearvars;
clf;
mu = [1; 1];
sigma = [0.1 -0.05; -0.05 0.2];

points = mvnrnd(mu, sigma, 1000);
x = points(:,1);
y = points(:,2);
counter = 0;

f = @(x,r) (transpose(x-mu)*inv(sigma)*(x-mu))/2 - r;

figure
hold on;
for i=1:size(x)
    if f([x(i); y(i)], 3) > 0 
        scatter(x(i), y(i), '.k');
        counter = counter+1;
    else
        scatter(x(i), y(i), '.b');
    end;
end;

ezplot(@(x,y) f([x; y], 3), [0 2 -1 3]);
ezplot(@(x,y) f([x; y], 2), [0 2 -1 3]);
ezplot(@(x,y) f([x; y], 1), [0 2 -1 3]);
title(counter, 'FontSize', 20);
hold off;
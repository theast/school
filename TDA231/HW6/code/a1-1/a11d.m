load('hw6_p1b.mat');
tic
z = k_means_rbf(2, X, 0.2);
toc

figure
hold on;
for i=1:length(X)
   if z(i, 1) == 1
        p1 = scatter(X(i, 1), X(i, 2), 'filled', 'r');
   else
        p2 = scatter(X(i, 1), X(i, 2), 'filled', 'b');
   end   
end
hold off;
legend([p1, p2], 'cluster 1', 'cluster 2', 'Location', 'northwest')


[z_save_after, z_convergence, mu_first, mu] = k_means(2, X, 1);
figure
hold on;
for i=1:length(X)
   if z_convergence(i, 1) == 1
        p1 = scatter(X(i, 1), X(i, 2), 'filled', 'r');
   else
        p2 = scatter(X(i, 1), X(i, 2), 'filled', 'b');
   end
   
   if z_convergence(i, :) ~= z_save_after(i, :)
       p3 = scatter(X(i, 1), X(i, 2), 100, 'k');
   end    
end

p4 = scatter(mu_first(:,1), mu_first(:,2), '+' ,'y');
p5 = scatter(mu(:,1), mu(:,2), 'g');
hold off;
legend([p1, p2, p3, p4, p5], 'cluster 1', 'cluster 2', 'has changed', 'start mu', 'end mu', 'Location', 'northwest')


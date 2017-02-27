function [] = plot2dim(x)

figure;
hold on;
[mu,sigma] = sge(x);
leg1 = plotcircle(mu(1),mu(2),sqrt(sigma), x);
leg2 = plotcircle(mu(1),mu(2),sqrt(sigma)*2, x);
leg3 = plotcircle(mu(1),mu(2),sqrt(sigma)*3, x);
legend(leg1, leg2, leg3);
scatter(x(:,1),x(:,2))
hold off;
end


X = dlmread('dataset0.txt');
sigma = cov(X);
RM = corrcov(sigma);

Y = X*diag(1 ./ max(X));

Ysigma = cov(Y);
Ry = corrcov(Ysigma);

figure
a=subplot(2,2,1);
plot(sigma);
title(a, 'Covariance of X', 'FontSize', 20);

b=subplot(2,2,2);
plot(RM);
title(b, 'Correlation of X', 'FontSize', 20);

c=subplot(2,2,3);
plot(Ysigma);
title(c, 'Covariance of Y', 'FontSize', 20);

d=subplot(2,2,4);
plot(Ry);
title(d, 'Correlation of Y', 'FontSize', 20);

figure
[M, I] = min(Ry(:));
[I_row, I_col] = ind2sub(size(Ry), I);
scatter(Y(:,I_row), Y(:,I_col), 'filled');

str = sprintf('Feature indices: %d and %d, Correlation value: %f', I_row, I_col, M);
title(str, 'FontSize', 20);